package pe.edu.utec.vetcare.service.impl;

import org.springframework.stereotype.Service;
import pe.edu.utec.vetcare.dto.request.CreateVeterinarioRequest;
import pe.edu.utec.vetcare.dto.request.UpdateVeterinarioRequest;
import pe.edu.utec.vetcare.dto.response.VeterinarioResponse;
import pe.edu.utec.vetcare.entity.UsuarioEntity;
import pe.edu.utec.vetcare.entity.VeterinarioEntity;
import pe.edu.utec.vetcare.mapper.VeterinarioMapper;
import pe.edu.utec.vetcare.repository.UsuarioRepository;
import pe.edu.utec.vetcare.repository.VeterinarioRepository;
import pe.edu.utec.vetcare.service.VeterinarioService;

import java.util.List;

@Service
public class VeterinarioServiceImpl implements VeterinarioService {

    private final VeterinarioRepository veterinarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final VeterinarioMapper veterinarioMapper;

    public VeterinarioServiceImpl(
            VeterinarioRepository veterinarioRepository,
            UsuarioRepository usuarioRepository,
            VeterinarioMapper veterinarioMapper) {

        this.veterinarioRepository = veterinarioRepository;
        this.usuarioRepository = usuarioRepository;
        this.veterinarioMapper = veterinarioMapper;
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
                                new RuntimeException(
                                        "Veterinario no encontrado"
                                )
                        );

        return veterinarioMapper.toResponse(entity);
    }

    @Override
    public VeterinarioResponse create(
            CreateVeterinarioRequest request) {

        UsuarioEntity usuario =
                usuarioRepository.findById(
                                request.getIdUsuario()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Usuario no encontrado"
                                )
                        );

        VeterinarioEntity entity =
                veterinarioMapper.toEntity(request);

        entity.setUsuario(usuario);

        VeterinarioEntity savedEntity =
                veterinarioRepository.save(entity);

        return veterinarioMapper.toResponse(savedEntity);
    }

    @Override
    public VeterinarioResponse update(
            Long id,
            UpdateVeterinarioRequest request) {

        VeterinarioEntity entity =
                veterinarioRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Veterinario no encontrado"
                                )
                        );

        veterinarioMapper.updateEntity(
                request,
                entity
        );

        VeterinarioEntity updatedEntity =
                veterinarioRepository.save(entity);

        return veterinarioMapper.toResponse(updatedEntity);
    }

    @Override
    public void delete(Long id) {

        VeterinarioEntity entity =
                veterinarioRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Veterinario no encontrado"
                                )
                        );

        veterinarioRepository.delete(entity);
    }
}