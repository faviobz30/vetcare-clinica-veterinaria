package pe.edu.utec.vetcare.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utec.vetcare.dto.request.UsuarioRequest;
import pe.edu.utec.vetcare.dto.response.UsuarioResponse;
import pe.edu.utec.vetcare.entity.RolEntity;
import pe.edu.utec.vetcare.entity.UsuarioEntity;
import pe.edu.utec.vetcare.exception.BadRequestException;
import pe.edu.utec.vetcare.exception.ResourceNotFoundException;
import pe.edu.utec.vetcare.mapper.UsuarioMapper;
import pe.edu.utec.vetcare.repository.RolRepository;
import pe.edu.utec.vetcare.repository.UsuarioRepository;
import pe.edu.utec.vetcare.service.UsuarioService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl
        implements UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final UsuarioMapper usuarioMapper;

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {

        return usuarioRepository.findAll()
                .stream()
                .map(usuarioMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioResponse obtener(Long id) {

        return usuarioMapper.toResponse(
                buscarUsuario(id)
        );
    }

    @Override
    @Transactional
    public UsuarioResponse crear(
            UsuarioRequest request
    ) {

        if (usuarioRepository
                .existsByCorreo(request.getCorreo())) {

            throw new BadRequestException(
                    "El correo ya se encuentra registrado"
            );
        }

        if (usuarioRepository
                .existsByNroDocumento(
                        request.getNroDocumento()
                )) {

            throw new BadRequestException(
                    "El documento ya se encuentra registrado"
            );
        }

        RolEntity rol = rolRepository
                .findById(request.getIdRol())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Rol no encontrado"
                        )
                );

        UsuarioEntity entity =
                usuarioMapper.toEntity(request);

        entity.setRol(rol);

        return usuarioMapper.toResponse(
                usuarioRepository.save(entity)
        );
    }

    @Override
    @Transactional
    public UsuarioResponse actualizar(
            Long id,
            UsuarioRequest request
    ) {

        UsuarioEntity entity =
                buscarUsuario(id);

        RolEntity rol = rolRepository
                .findById(request.getIdRol())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Rol no encontrado"
                        )
                );

        usuarioMapper.updateEntity(
                request,
                entity
        );

        entity.setRol(rol);

        return usuarioMapper.toResponse(
                usuarioRepository.save(entity)
        );
    }

    @Override
    @Transactional
    public void eliminar(Long id) {

        UsuarioEntity entity =
                buscarUsuario(id);

        usuarioRepository.delete(entity);
    }

    private UsuarioEntity buscarUsuario(Long id) {

        return usuarioRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Usuario no encontrado"
                        )
                );
    }
}