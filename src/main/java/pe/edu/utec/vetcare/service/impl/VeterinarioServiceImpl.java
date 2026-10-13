package pe.edu.utec.vetcare.service.impl;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utec.vetcare.dto.request.CreateVeterinarioRequest;
import pe.edu.utec.vetcare.dto.request.UpdateVeterinarioRequest;
import pe.edu.utec.vetcare.dto.response.VeterinarioResponse;
import pe.edu.utec.vetcare.entity.RolEntity;
import pe.edu.utec.vetcare.entity.UsuarioEntity;
import pe.edu.utec.vetcare.entity.VeterinarioEntity;
import pe.edu.utec.vetcare.exception.BadRequestException;
import pe.edu.utec.vetcare.exception.ResourceNotFoundException;
import pe.edu.utec.vetcare.mapper.VeterinarioMapper;
import pe.edu.utec.vetcare.repository.RolRepository;
import pe.edu.utec.vetcare.repository.UsuarioRepository;
import pe.edu.utec.vetcare.repository.VeterinarioRepository;
import pe.edu.utec.vetcare.service.VeterinarioService;

import java.util.List;

@Service
public class VeterinarioServiceImpl implements VeterinarioService {

    private final VeterinarioRepository veterinarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final VeterinarioMapper veterinarioMapper;
    private final PasswordEncoder passwordEncoder;

    public VeterinarioServiceImpl(
            VeterinarioRepository veterinarioRepository,
            UsuarioRepository usuarioRepository,
            RolRepository rolRepository,
            VeterinarioMapper veterinarioMapper,
            PasswordEncoder passwordEncoder
    ) {
        this.veterinarioRepository = veterinarioRepository;
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.veterinarioMapper = veterinarioMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public List<VeterinarioResponse> getAll() {

        return veterinarioRepository.findAll()
                .stream()
                .map(veterinarioMapper::toResponse)
                .toList();
    }

    @Override
    public VeterinarioResponse getById(Long id) {

        VeterinarioEntity entity =
                veterinarioRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Veterinario no encontrado"
                                )
                        );

        return veterinarioMapper.toResponse(entity);
    }

    @Override
    @Transactional
    public VeterinarioResponse create(
            CreateVeterinarioRequest request
    ) {

        // 1. Verificar que el correo no exista
        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new BadRequestException(
                    "El correo ya se encuentra registrado"
            );
        }

        // 2. Verificar que el documento no exista
        if (usuarioRepository.existsByNroDocumento(
                request.getNroDocumento()
        )) {
            throw new BadRequestException(
                    "El documento ya se encuentra registrado"
            );
        }

        // 3. Buscar ROLE_VETERINARIO
        RolEntity rolVeterinario =
                rolRepository
                        .findByNombre("ROLE_VETERINARIO")
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Rol ROLE_VETERINARIO no encontrado"
                                )
                        );

        // 4. Crear el usuario
        UsuarioEntity usuario = new UsuarioEntity();

        usuario.setNombres(request.getNombres());
        usuario.setApellidos(request.getApellidos());
        usuario.setTipoDocumento(request.getTipoDocumento());
        usuario.setNroDocumento(request.getNroDocumento());
        usuario.setCorreo(request.getCorreo());
        usuario.setNroCelular(request.getNroCelular());

        // 5. Encriptar contraseña
        usuario.setContrasena(
                passwordEncoder.encode(
                        request.getContrasena()
                )
        );

        // 6. Asignar ROLE_VETERINARIO
        usuario.setRol(rolVeterinario);

        // 7. Guardar usuario
        UsuarioEntity usuarioGuardado =
                usuarioRepository.save(usuario);

        // 8. Crear perfil de veterinario
        VeterinarioEntity veterinario =
                veterinarioMapper.toEntity(request);

        // 9. Relacionar veterinario con usuario
        veterinario.setUsuario(usuarioGuardado);

        // 10. Guardar veterinario
        VeterinarioEntity veterinarioGuardado =
                veterinarioRepository.save(veterinario);

        // 11. Devolver respuesta
        return veterinarioMapper.toResponse(
                veterinarioGuardado
        );
    }

    @Override
    public VeterinarioResponse update(
            Long id,
            UpdateVeterinarioRequest request
    ) {

        VeterinarioEntity entity =
                veterinarioRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Veterinario no encontrado"
                                )
                        );

        veterinarioMapper.updateEntity(
                request,
                entity
        );

        VeterinarioEntity updatedEntity =
                veterinarioRepository.save(entity);

        return veterinarioMapper.toResponse(
                updatedEntity
        );
    }

    @Override
    public void delete(Long id) {

        VeterinarioEntity entity =
                veterinarioRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Veterinario no encontrado"
                                )
                        );

        veterinarioRepository.delete(entity);
    }
}